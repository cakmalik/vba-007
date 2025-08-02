
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const qrUrl = query.url;

  if (!qrUrl || typeof qrUrl !== "string") {
    throw createError({ statusCode: 400, message: "QR URL diperlukan" });
  }

  const response = await fetch(qrUrl);
  const blob = await response.blob();

  event.node.res.setHeader("Content-Type", blob.type);
  event.node.res.setHeader("Content-Disposition", 'attachment; filename="qrcode.png"');

  return blob.stream();
});
