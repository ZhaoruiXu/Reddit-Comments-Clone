import fastify from "fastify";
import sensible from "@fastify/sensible";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
dotenv.config();

// similar to Express
const app = fastify();
// sensible lib for db error handling
app.register(sensible);
// cookie lib from fastify
app.register(cookie, { secret: process.env.COOKIE_SECRET });
// cross origin resource sharing between the client and server URL
app.register(cors, {
  // origin: process.env.CLIENT_URL,
  origin:
    process.env.NODE_ENV !== "production"
      ? process.env.DEV_CLIENT_URL
      : process.env.LIVE_CLIENT_URL,
  credentials: true, // for Cookies
});
// middleware
app.addHook("onRequest", (req, res, done) => {
  if (req.cookies.userId !== CURRENT_USER_ID) {
    req.cookies.userId = CURRENT_USER_ID;
    res.clearCookie("userId");
    res.setCookie("userId", CURRENT_USER_ID, {
      path: "/",
      sameSite: "none",
      secure: true,
      httpOnly: false,
    });
  }
  done();
});

// create a client
const prisma = new PrismaClient();

// faking it as the current logged-in user is Kyle
const CURRENT_USER_ID = (
  await prisma.user.findFirst({
    where: { name: "Kyle" },
  })
).id;

const COMMENT_SELECT_FIELDS = {
  id: true,
  message: true,
  parentId: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      name: true,
    },
  },
};

// handle db errors
const commitToDb = async promise => {
  const [error, data] = await app.to(promise);
  if (error) return app.httpErrors.internalServerError(error.message);
  return data;
};

// get all posts
app.get("/posts", async (req, res) => {
  // wrap in the commitToDb function for handle data and error
  return await commitToDb(
    prisma.post.findMany({
      select: { id: true, title: true }, // "select" is to limit the return fields
    })
  );
});

// get one post
app.get("/posts/:id", async (req, res) => {
  const postId = req.params.id;

  return await commitToDb(
    prisma.post
      .findUnique({
        where: { id: postId }, // "where" will return all fields of the Post model, not including foreign relation fields (use "select" OR "include" for that)
        select: {
          body: true,
          title: true,
          id: true,
          comments: {
            orderBy: {
              createdAt: "desc",
            },
            select: {
              ...COMMENT_SELECT_FIELDS,
              _count: { select: { likes: true } }, // To return a count of relations (for example, a user's post count)
            },
          },
        },
      })
      .then(async post => {
        const myLikes = await prisma.like.findMany({
          where: {
            // all the likes the current client user made in any of the comments in a post (the comments current user liked)
            userId: req.cookies.userId,
            commentId: { in: post.comments.map(comment => comment.id) }, // give an array of all the ids of all the comments in the post
          },
        });

        return {
          ...post,
          comments: post.comments.map(comment => {
            const { _count, ...commentFields } = comment;
            return {
              ...commentFields, // the original return is from the "select"
              // add two more custom(not from defined in Prisma Schema) info fields in the returned object to the front end
              isLikedByMe: myLikes.some(
                myLike => myLike.commentId === comment.id
              ), // boolean, tests whether at least one element in the array passes the test implemented by the provided function
              likeCount: _count.likes, // number of all likes on the comment
            };
          }),
        };
      })
  );
});

// create a comment
app.post("/posts/:id/comments", async (req, res) => {
  if (req.body.message === "" || req.body.message == null) {
    return res.send(app.httpErrors.badRequest("Message is required"));
  }

  return await commitToDb(
    prisma.comment
      .create({
        data: {
          parentId: req.body.parentId,
          message: req.body.message,
          userId: req.cookies.userId,
          postId: req.params.id,
        },
        select: COMMENT_SELECT_FIELDS,
      })
      .then(comment => {
        return {
          ...comment, // the original return is from the "select"
          // add two more custom(not from defined in Prisma Schema) info fields
          likeCount: 0,
          isLikedByMe: false,
        };
      })
  );
});

// update a comment
app.put("/posts/:postId/comments/:commentId", async (req, res) => {
  if (req.body.message === "" || req.body.message == null) {
    return res.send(app.httpErrors.badRequest("Message is required"));
  }

  // check the comment user
  const { userId } = await prisma.comment.findUnique({
    where: { id: req.params.commentId },
    select: { userId: true }, // "select what you want to return back"
  });

  // compare the comment user with the current client user
  if (userId !== req.cookies.userId) {
    return res.send(
      app.httpErrors.unauthorized(
        "You do not have permission to edit this message"
      )
    );
  }

  return await commitToDb(
    prisma.comment.update({
      where: { id: req.params.commentId },
      data: {
        message: req.body.message,
      },
      select: {
        message: true,
        id: true,
      },
    })
  );
});

// delete a comment
app.delete("/posts/:postId/comments/:commentId", async (req, res) => {
  const { userId } = await prisma.comment.findUnique({
    where: { id: req.params.commentId },
    select: { userId: true }, // "select what you want to return back"
  });

  if (userId !== req.cookies.userId) {
    return res.send(
      app.httpErrors.unauthorized(
        "You do not have permission to delete this message"
      )
    );
  }

  return await commitToDb(
    prisma.comment.delete({
      where: { id: req.params.commentId },
      select: { id: true },
    })
  );
});

// toggle comment like status
app.post("/posts/:postId/comments/:commentId/toggleLike", async (req, res) => {
  // 3 pieces of info required (postId, commentId, userId(from cookie))

  const data = {
    // jointed info
    commentId: req.params.commentId,
    userId: req.cookies.userId,
  };

  // is there a like by me?
  const like = await prisma.like.findUnique({
    where: { userId_commentId: data }, // jointed id for the Like Schema
  });

  if (like == null) {
    return await commitToDb(prisma.like.create({ data })).then(() => {
      return { isAddLike: true, id: data.commentId };
    });
  } else {
    return await commitToDb(
      prisma.like.delete({ where: { userId_commentId: data } })
    ).then(() => {
      return { isAddLike: false, id: data.commentId };
    });
  }
});

app.listen({ port: process.env.PORT, host: "0.0.0.0" });
