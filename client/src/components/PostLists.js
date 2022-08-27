// import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPosts } from "../services/posts";
import { useAsync } from "../hooks/useAsync";

export default function PostLists() {
  // server side states
  const { loading, error, value: posts } = useAsync(getPosts);

  if (loading) return <h1>Loading</h1>;
  if (error) return <h1 className='error-msg'>{error}</h1>;

  return (
    <section>
      {posts?.map(post => {
        return (
          <h1 key={post.id}>
            <Link to={`/posts/${post.id}`}>{post.title}</Link>
          </h1>
        );
      })}
    </section>
  );
}
