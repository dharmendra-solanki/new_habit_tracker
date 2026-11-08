export function GET() {
  return Response.json({
    success: true,
    data: {
      status: "ok",
    },
    timestamp: new Date().toISOString(),
  });
}
