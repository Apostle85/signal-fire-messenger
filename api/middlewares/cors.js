const allowedCors = [
  'https://eliproject.students.nomoredomains.club',
  'http://eliproject.students.nomoredomains.club',
  'http://localhost:3001',
];

// Значение для заголовка Access-Control-Allow-Methods по умолчанию (разрешены все типы запросов)
const DEFAULT_ALLOWED_METHODS = 'GET,HEAD,PUT,PATCH,POST,DELETE';

module.exports = (req, res, next) => {
  const { origin } = req.headers; // Сохраняем источник запроса в переменную origin
  // проверяем, что источник запроса есть среди разрешённых
  if (allowedCors.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }

  const requestHeaders = req.headers['access-control-request-headers'];
  const { method } = req; // Сохраняем тип запроса (HTTP-метод) в соответствующую переменную

  if (method === 'OPTIONS') {
    // разрешаем кросс-доменные запросы с этими заголовками и методами
    res.header('Access-Control-Allow-Methods', DEFAULT_ALLOWED_METHODS);
    res.header('Access-Control-Allow-Headers', requestHeaders);
    // завершаем обработку запроса и возвращаем результат клиенту
    return res.end();
  }
  return next();
};
