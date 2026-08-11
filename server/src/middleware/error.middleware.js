export function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: "Route not found" });
}

export function errorHandler(err, req, res, next) {
  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  if (err.name === "ValidationError" || err.name === "ZodError") {
    return res.status(422).json({ success: false, message: err.message });
  }

  if (err.code === "P2002") {
    return res.status(409).json({ success: false, message: "Duplicate record already exists." });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
}
