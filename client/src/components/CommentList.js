import Comment from "./Comment";

const CommentList = ({ comments }) => {
  return comments.map(comment => {
    return (
      <div key={comment.id} className='comment-stack'>
        <Comment {...comment} />
        {/* <Comment
          message={comment.message}
          id={comment.id}
          user={comment.user}
          createdAt={comment.createdAt}
          likedByMe={comment.likedByMe}
          likeCount={comment.likeCount}
        /> */}
      </div>
    );
  });
};
export default CommentList;
