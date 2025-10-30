import { useState } from "react";

import IconBtn from "./IconBtn";
import { usePost } from "../contexts/PostContext";
import CommentList from "./CommentList";
import CommentForm from "./CommentForm";
import { useAsyncFn } from "../hooks/useAsync";
import {
  createComment,
  updateComment,
  deleteComment,
  toggleCommentLike,
} from "../services/comments";
import { useUser } from "../hooks/useUser";

import { FaHeart, FaRegHeart, FaReply, FaEdit, FaTrash } from "react-icons/fa";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

const Comment = ({ id, message, user, createdAt, likeCount, isLikedByMe }) => {
  const [areChildrenHidden, setAreChildrenHidden] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // console.log("count like", likeCount);
  // console.log("likebyme", isLikedByMe);

  // use the context
  const {
    post,
    getReplies,
    createLocalComment,
    updateLocalComment,
    deleteLocalComment,
    toggleLocalCommentLike,
  } = usePost();

  const createCommentFn = useAsyncFn(createComment);
  const updateCommentFn = useAsyncFn(updateComment);
  const deleteCommentFn = useAsyncFn(deleteComment);
  const toggleCommentLikeFn = useAsyncFn(toggleCommentLike);
  const childComments = getReplies(id);
  const currentUser = useUser();

  const onCommentReply = message => {
    return createCommentFn
      .execute({ postId: post.id, message, parentId: id }) // talk to the database
      .then(comment => {
        // after talking the database and if success, the db will turn a Promise with the newly created commented
        setIsReplying(false);
        createLocalComment(comment);
      });
  };

  const onCommentUpdate = message => {
    return updateCommentFn
      .execute({ postId: post.id, message, id })
      .then(comment => {
        // if success
        setIsEditing(false);
        updateLocalComment(comment.id, comment.message);
      });
  };

  const onCommentDelete = () => {
    return deleteCommentFn.execute({ postId: post.id, id }).then(comment => {
      // if success
      deleteLocalComment(comment.id);
    });
  };

  const onToggleCommentLike = () => {
    return toggleCommentLikeFn
      .execute({ postId: post.id, id })
      .then(comment => {
        // if success
        toggleLocalCommentLike(comment.id, comment.isAddLike);
      });
  };

  const moveCaretAtEnd = e => {
    const temp_value = message;
    e.target.value = "";
    e.target.value = temp_value;
  };

  return (
    <>
      <div className='comment'>
        <div className='header'>
          <span className='name'>{user.name}</span>
          <span className='date'>
            {dateFormatter.format(Date.parse(createdAt))}
          </span>
        </div>

        {isEditing ? (
          <CommentForm
            autoFocus
            onFocus={moveCaretAtEnd}
            initialValue={message}
            onSubmit={onCommentUpdate}
            loading={updateCommentFn.loading}
            error={updateCommentFn.error}
          />
        ) : (
          <div className='message'>{message}</div>
        )}

        <div className='footer'>
          <IconBtn
            Icon={isLikedByMe ? FaHeart : FaRegHeart}
            aria-label={isLikedByMe ? "Unlike" : "Like"}
            onClick={onToggleCommentLike}
            disabled={toggleCommentLikeFn.loading}>
            {likeCount}
          </IconBtn>
          <IconBtn
            onClick={() => setIsReplying(prev => !prev)}
            isActive={isReplying}
            Icon={FaReply}
            aria-label={isReplying ? "Cancle Reply" : "Reply"}
          />
          {currentUser.id === user.id && (
            <>
              <IconBtn
                onClick={() => setIsEditing(prev => !prev)}
                isActive={isEditing}
                Icon={FaEdit}
                aria-label={isEditing ? "Cancle Edit" : "Edit"}
              />
              <IconBtn
                onClick={onCommentDelete}
                disabled={deleteCommentFn.loading}
                Icon={FaTrash}
                aria-label='Delete'
                color='danger'
              />
            </>
          )}
        </div>
        {deleteCommentFn.error && (
          <div className='error-msg mt-1'>{deleteCommentFn.error}</div>
        )}
      </div>

      {isReplying && (
        <div className='mt-1 ml-3'>
          <CommentForm
            autoFocus
            onSubmit={onCommentReply}
            loading={createCommentFn.loading}
            error={createCommentFn.error}
          />
        </div>
      )}

      {childComments?.length > 0 && (
        <>
          <div
            className={`nested-comments-stack ${
              areChildrenHidden ? "hide" : ""
            }`}>
            <button
              className='collapse-line'
              aria-label='Hide Replies'
              onClick={() => setAreChildrenHidden(true)}
            />
            <div className='nested-comments'>
              <CommentList comments={childComments} />
            </div>
          </div>
          <button
            className={`btn mt-1 ${!areChildrenHidden ? "hide" : ""}`}
            onClick={() => setAreChildrenHidden(false)}>
            Show Replies
          </button>
        </>
      )}
    </>
  );
};
export default Comment;
