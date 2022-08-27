import { usePost } from "../contexts/PostContext";
import CommentList from "./CommentList.js";
import CommentForm from "./CommentForm";
import { useAsyncFn } from "../hooks/useAsync";
import { createComment } from "../services/comments";

export default function Post() {
  const { post, rootComments, createLocalComment } = usePost();
  const {
    loading,
    error,
    execute: createCommentFn,
  } = useAsyncFn(createComment);

  const onCommentCreate = message => {
    // return a Promise to clear input in CommentForm.js
    return createCommentFn({ postId: post.id, message }).then(comment => {
      createLocalComment(comment);
    });
  };

  console.log("rootComments", rootComments);

  return (
    <>
      <h1>{post.title}</h1>
      <article>{post.body}</article>
      <h3 className='comments-title'>Comment</h3>
      <section>
        <CommentForm
          loading={loading}
          error={error}
          onSubmit={onCommentCreate}
        />
        {rootComments != null && rootComments?.length > 0 && (
          <div className='mt-4'>
            <CommentList comments={rootComments} />
          </div>
        )}
      </section>
    </>
  );
}
