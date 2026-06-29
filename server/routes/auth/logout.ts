export default defineEventHandler(async (event) => {
  const session = await useAppSession(event);
  await session.clear();
  
  const host = getRequestHeader(event, 'host') || '';
  const isSecure = !host.includes('localhost') && !host.match(/^\d{1,3}\./);

  deleteCookie(event, 'h3', {
    path: '/',
    sameSite: isSecure ? 'none' : 'lax',
    secure: isSecure,
    httpOnly: true
  });
  
  return { success: true };
});
