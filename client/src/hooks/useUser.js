// pull userId from cookies
export const useUser = () => {
  const match = document.cookie.match(/userId=(?<id>[^;]+);?/);
  return { id: match?.groups?.id };
};
