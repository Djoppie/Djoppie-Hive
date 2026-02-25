# Swagger/OpenAPI Quick Start Guide

## Start de API met Swagger UI

```bash
cd C:\Djoppie\Djoppie-Hive\src\backend\DjoppieHive.API
dotnet run
```

Open je browser en ga naar: **http://localhost:5014/swagger**

## Stap 1: Verkrijg een Access Token

### Via MSAL React (Frontend)

```typescript
import { useMsal } from "@azure/msal-react";

const { instance, accounts } = useMsal();

const getAccessToken = async () => {
  const request = {
    scopes: ["api://2b620e06-39ee-4177-a559-76a12a79320f/access_as_user"],
    account: accounts[0]
  };

  try {
    const response = await instance.acquireTokenSilent(request);
    return response.accessToken;
  } catch (error) {
    const response = await instance.acquireTokenPopup(request);
    return response.accessToken;
  }
};
```

### Via Azure CLI (Development/Testing)

```bash
# Login met je Diepenbeek account
az login --tenant 7db28d6f-d542-40c1-b529-5e5ed2aad545

# Verkrijg access token
az account get-access-token \
  --resource api://2b620e06-39ee-4177-a559-76a12a79320f \
  --query accessToken \
  --output tsv
```

## Stap 2: Authenticeer in Swagger UI

1. Klik op de **"Authorize"** knop (rechtsboven met slot icoon)
2. Voer je Bearer token in het veld in:
   ```
   eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiIyYjYyMGUwNi0z...
   ```
   (NIET "Bearer eyJ..." - alleen de token zelf!)
3. Klik **"Authorize"**
4. Klik **"Close"**

Nu zijn alle API calls geauthenticeerd!

## Stap 3: Test een Endpoint

### Voorbeeld 1: Haal huidige gebruiker op

1. Zoek de **"Gebruiker"** sectie
2. Klik op `GET /api/Me`
3. Klik **"Try it out"**
4. Klik **"Execute"**

**Response**:
```json
{
  "id": "abc123-def456",
  "email": "jouw.naam@diepenbeek.be",
  "displayName": "Jouw Naam",
  "roles": ["HrAdmin"],
  "permissions": [
    "view_all_employees",
    "edit_employees",
    "validate_changes"
  ],
  "isAdmin": true
}
```

### Voorbeeld 2: Haal alle medewerkers op

1. Zoek de **"Medewerkers"** sectie
2. Klik op `GET /api/Employees`
3. Klik **"Try it out"**
4. (Optioneel) Voer filters in:
   - `type`: `Personeel`
   - `isActive`: `true`
5. Klik **"Execute"**

### Voorbeeld 3: Maak een nieuwe medewerker aan

1. Zoek `POST /api/Employees`
2. Klik **"Try it out"**
3. Bewerk de request body:

```json
{
  "displayName": "Test Medewerker",
  "givenName": "Test",
  "surname": "Medewerker",
  "email": "test.medewerker@diepenbeek.be",
  "jobTitle": "Test Engineer",
  "department": "ICT",
  "employeeType": "Personeel",
  "arbeidsRegime": "Voltijds",
  "startDatum": "2024-01-01T00:00:00Z",
  "isActive": true
}
```

4. Klik **"Execute"**

**Response** (201 Created):
```json
{
  "id": "98765432-1234-1234-1234-123456789012",
  "displayName": "Test Medewerker",
  "email": "test.medewerker@diepenbeek.be",
  "bron": "Handmatig",
  "isHandmatigToegevoegd": true,
  "validatieStatus": "Nieuw",
  "createdAt": "2024-12-01T10:30:00Z"
}
```

## Stap 4: Exploreer de API

### Endpoint Tags

Klik op de tags om te filteren:

- **Medewerkers** - CRUD voor personeel
- **Gebruiker** - Ingelogde gebruiker info
- **Synchronisatie** - Azure AD sync
- **Distributiegroepen** - MG- groepen
- **Audit & Compliance** - Logs
- **Rollenbeheer** - Rollen toekennen
- **Vrijwilligers** - Vrijwilliger management
- **Statistieken** - Dashboard KPI's
- **Evenementen** - Events en uitnodigingen
- **Validatie** - Goedkeuring workflow

### Schema's

Klik onderaan op **"Schemas"** om alle DTOs en enums te bekijken.

## Stap 5: Exporteer naar Postman

1. Klik op `/swagger/v1/swagger.json` (bovenaan de pagina)
2. Kopieer de URL: `http://localhost:5014/swagger/v1/swagger.json`
3. Open Postman
4. **Import** → **Link**
5. Plak de URL en klik **Continue**
6. Alle endpoints worden geïmporteerd als collectie

### Authenticatie instellen in Postman

1. Selecteer de geïmporteerde collectie
2. **Authorization** tab
3. Type: **Bearer Token**
4. Plak je access token
5. Alle requests gebruiken nu dit token

## Common Errors

### 401 Unauthorized

**Oorzaak**: Token ontbreekt of is ongeldig

**Oplossing**:
- Controleer of je geauthorizeerd bent in Swagger UI
- Vernieuw je token (tokens expireren na 1 uur)
- Controleer token scope: moet `access_as_user` bevatten

### 403 Forbidden

**Oorzaak**: Onvoldoende rechten

**Oplossing**:
- Controleer je rollen via `GET /api/Me`
- Alleen admins kunnen bepaalde endpoints gebruiken (bijv. delete, sync)

### 429 Too Many Requests

**Oorzaak**: Rate limit overschreden

**Oplossing**:
- Wacht `Retry-After` seconden (zie response header)
- Globale limiet: 100 req/min
- Sync limiet: 5 req/5min

### 500 Internal Server Error

**Oorzaak**: Server-side fout

**Oplossing**:
- Check API logs in console/terminal
- Rapporteer de fout aan ICT team
- Include request details en timestamp

## Developer Tips

### Auto-Refresh Token

```typescript
// Axios interceptor voor automatische token refresh
import axios from 'axios';
import { instance } from './msalInstance';

axios.interceptors.request.use(async (config) => {
  const request = {
    scopes: ["api://2b620e06-39ee-4177-a559-76a12a79320f/access_as_user"],
    account: instance.getAllAccounts()[0]
  };

  try {
    const response = await instance.acquireTokenSilent(request);
    config.headers.Authorization = `Bearer ${response.accessToken}`;
  } catch (error) {
    // Fallback to popup
    const response = await instance.acquireTokenPopup(request);
    config.headers.Authorization = `Bearer ${response.accessToken}`;
  }

  return config;
});
```

### Error Response Handling

```typescript
try {
  const response = await axios.post('/api/Employees', data);
  console.log('Created:', response.data);
} catch (error) {
  if (error.response?.status === 400) {
    // Validation error
    const errors = error.response.data.errors;
    console.error('Validation failed:', errors);
  } else if (error.response?.status === 401) {
    // Unauthorized - refresh token
    console.error('Token expired - please login again');
  } else if (error.response?.status === 403) {
    // Forbidden - insufficient permissions
    console.error('Access denied');
  } else {
    // Other errors
    console.error('API error:', error.response?.data);
  }
}
```

### Rate Limit Monitoring

```typescript
axios.interceptors.response.use((response) => {
  const remaining = response.headers['x-ratelimit-remaining'];
  const limit = response.headers['x-ratelimit-limit'];

  if (remaining && parseInt(remaining) < 10) {
    console.warn(`Rate limit warning: ${remaining}/${limit} remaining`);
  }

  return response;
});
```

## Production Usage

### Swagger UI in Productie

Swagger UI is **uitgeschakeld** in productie om security redenen.

### Alternatieve Tools

**Postman**:
1. Importeer OpenAPI spec (zie stap 5)
2. Stel environment variabelen in:
   - `API_URL`: `https://app-djoppie-hive-dev-api.azurewebsites.net`
   - `ACCESS_TOKEN`: `{{access_token}}`

**Insomnia**:
1. **Create** → **Design Document**
2. Importeer: `http://localhost:5014/swagger/v1/swagger.json`
3. Switch naar **Debug** tab voor requests

**curl**:
```bash
# Voorbeeld: Haal medewerkers op
curl -X GET "https://app-djoppie-hive-dev-api.azurewebsites.net/api/Employees" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -H "Accept: application/json"
```

## Resources

- **Volledige API Docs**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Swagger Spec**: http://localhost:5014/swagger/v1/swagger.json
- **Swagger Editor**: https://editor.swagger.io (upload spec voor validatie)
- **JWT Decoder**: https://jwt.io (decode token om claims te bekijken)

## Support

**Vragen?** Contacteer ICT Diepenbeek:
- Email: ict@diepenbeek.be
- Teams: ICT Support channel
