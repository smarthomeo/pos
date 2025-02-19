bind = "0.0.0.0:5000"
workers = 4
worker_class = "gevent"
timeout = 120
errorlog = '/var/log/secure-auth.log'
accesslog = '/var/log/secure-auth.log'
loglevel = 'debug'
