export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const session = await useSession(event, {
    password: config.sessionSecret as string,
    maxAge: 60 * 60 * 24 * 30
  });
  await session.clear();
  return sendRedirect(event, '/login', 302);
});
