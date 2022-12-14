let { errorLog } = require("../error_logger");
const error404 = (req, res, next) => {
  const error = new Error(`${req.url} ${req.method} 존재하지 않습니다.`);
  error.status = 404;
  next(error);
};

const error = (err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = err;
  errorLog.error({
    label: err.status || 500,
    message: err.name + "-" + err.message || "null",
  });
  res.status(err.status || 500).json({ message: err.message, data: false });
};

module.exports = {
  error404,
  error,
};
