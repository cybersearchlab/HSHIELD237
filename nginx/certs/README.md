Placez ici vos certificats TLS :

- `fullchain.pem`
- `privkey.pem`

Pour un certificat auto-signé en local :

```
openssl req -x509 -nodes -newkey rsa:2048 \
  -keyout privkey.pem -out fullchain.pem \
  -days 365 -subj "/CN=localhost"
```

Ce dossier est ignoré par git (voir `.gitignore`), à l'exception de ce README.
