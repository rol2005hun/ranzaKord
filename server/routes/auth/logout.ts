export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const session = await useSession(event, { password: config.sessionSecret as string });
  await session.clear();
  return sendRedirect(event, '/login', 302);
});
