# maintenance_proj

Maintenance Portal Flutter app integrated with SAP OData.

## Local Web Login

SAP Gateway is hosted on `http://AZKTLDS5CP.kcloud.com:8000`. Browser builds
must use a local proxy because OData login uses `POST` with authorization
headers, which triggers a CORS preflight request.

Start the proxy first:

```sh
npm run sap-proxy
```

To avoid typing SAP credentials every time, create `.env.local` in this project
folder using `.env.local.example` as the template:

```text
SAP_BASIC_USER=your-sap-user
SAP_BASIC_PASSWORD=your-sap-password
```

`.env.local` is ignored by git. After that, `npm run sap-proxy` reads it
automatically.

The proxy also fetches SAP's `X-CSRF-Token` automatically for OData create,
update, and delete requests. A `403 Access denied` during login usually means
the proxy was not restarted after changes, the SAP user lacks authorization for
the Gateway service, or SAP rejected the CSRF/session token.

If SAP Gateway asks for NetWeaver authentication, use a real SAP user in
`.env.local`. Do not use the employee login table password for this. You can
also override `.env.local` temporarily from a terminal.

PowerShell override:

```powershell
$env:SAP_BASIC_USER = "<sap-user>"
$env:SAP_BASIC_PASSWORD = "<sap-password>"
npm run sap-proxy
```

Command Prompt:

```bat
set SAP_BASIC_USER=<sap-user>
set SAP_BASIC_PASSWORD=<sap-password>
npm run sap-proxy
```

Then run the Flutter web app:

```sh
flutter run -d chrome
```

Desktop and mobile builds still call SAP Gateway directly. To override the API
host for any build, pass:

```sh
flutter run -d chrome --dart-define=SAP_BASE_URL=http://localhost:8080
```

The Employee ID and password from `ZMNTLOGIN_110_T` are sent only in the OData
request body. They are not SAP Gateway Basic Auth credentials.
