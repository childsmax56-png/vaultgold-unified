export const onRequestGet: PagesFunction = async () => {
  return new Response("pong", { status: 200 });
};
