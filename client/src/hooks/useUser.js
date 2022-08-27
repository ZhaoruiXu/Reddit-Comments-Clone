// pull userId from cookies
export const useUser = () => {
  return { id: document.cookie.match(/userId=(?<id>[^;]+);?$/).groups.id };
};
