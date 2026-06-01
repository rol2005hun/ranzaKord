export default defineEventHandler(async (event) => {
  const session = await useAppSession(event);
  await session.clear();
  return { success: true };
});
