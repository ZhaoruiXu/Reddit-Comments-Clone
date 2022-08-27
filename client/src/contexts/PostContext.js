// Global State Handler

import { createContext, useContext, useMemo, useState, useEffect } from "react";
import { useAsync } from "../hooks/useAsync";
import { getPost } from "../services/posts";
import { useParams } from "react-router-dom";

const PostContext = createContext();

// custom hook to use the context (access the "value" prop)
export const usePost = () => {
  return useContext(PostContext);
};

export default function PostProvider({ children }) {
  const { id } = useParams();

  // server side states
  const { loading, error, value: post } = useAsync(() => getPost(id), [id]);

  console.log("current post", post);
  // store comments from server to local states
  const [comments, setComments] = useState([]);

  useEffect(() => {
    if (post?.comments == null) return;
    setComments(post.comments);
  }, [post?.comments]);

  const commentsByParentId = useMemo(() => {
    if (comments == null) return [];

    const hashGroupMap = {};
    comments.forEach(comment => {
      if (hashGroupMap[comment.parentId] === undefined) {
        hashGroupMap[comment.parentId] = [];
        hashGroupMap[comment.parentId].push(comment);
      } else {
        hashGroupMap[comment.parentId].push(comment);
      }
    });

    return hashGroupMap;
  }, [comments]); // when there is new comments(including sub-comments) or deleted comments or changed likes or edited comments or orchanged post

  // console.log("comments", commentsByParentId);

  const getReplies = parentId => {
    // commentsByParentId is not a function. it is a value stored in the memory
    const getCommentsByParentId = commentsByParentId;
    return getCommentsByParentId[parentId];
  };

  const createLocalComment = comment => {
    setComments(prev => [comment, ...prev]);
  };

  const updateLocalComment = (id, message) => {
    setComments(prev =>
      prev.map(comment => {
        if (comment.id === id) {
          return { ...comment, message };
        } else {
          return comment;
        }
      })
    );
  };

  const deleteLocalComment = id => {
    setComments(prev => prev.filter(comment => comment.id !== id));
  };

  const toggleLocalCommentLike = (id, isAddLike) => {
    setComments(prevComments => {
      return prevComments.map(prevComment => {
        if (id === prevComment.id) {
          if (isAddLike) {
            return {
              ...prevComment,
              likeCount: prevComment.likeCount + 1,
              isLikedByMe: true,
            };
          } else {
            return {
              ...prevComment,
              likeCount: prevComment.likeCount - 1,
              isLikedByMe: false,
            };
          }
        } else {
          return prevComment;
        }
      });
    });
  };

  return (
    <PostContext.Provider
      value={{
        post: post,
        rootComments: commentsByParentId[null],
        getReplies,
        createLocalComment,
        updateLocalComment,
        deleteLocalComment,
        toggleLocalCommentLike,
      }}>
      {loading ? (
        <h1>Loading...</h1>
      ) : error ? (
        <h1 className='error-msg'>{error}</h1>
      ) : (
        children
      )}
    </PostContext.Provider>
  );
}
