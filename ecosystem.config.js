module.exports = {
  apps: [
    {
      name: 'asp-xms-service-production',
      script: 'dist/main.js',
      env: {
        NODE_ENV: 'production',
      },
      log_file: '/app/logs/app.log',
      out_file: '/app/logs/out.log',
      error_file: '/app/logs/error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm Z',
    },
  ],
};
