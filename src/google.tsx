import { OAuth } from "@raycast/api";
import fetch from "node-fetch";
import { Contact } from './types'


// Create an OAuth client ID via https://console.developers.google.com/apis/credentials
// As application type choose "iOS" (required for PKCE)
// As Bundle ID enter: com.raycast
const clientId = "1053927040595-o0tnk1m84gi7udgi6lpiki7jftcikbrp.apps.googleusercontent.com";

const client = new OAuth.PKCEClient({
  redirectMethod: OAuth.RedirectMethod.AppURI,
  providerName: "Google",
  providerIcon: "google-logo.png",
  providerId: "google",
  description: "Connect your Google account\n(Raycast Extension Demo)",
});

// Authorization

export async function authorize(): Promise<void> {
  const tokenSet = await client.getTokens();
  if (tokenSet?.accessToken) {
    if (tokenSet.refreshToken && tokenSet.isExpired()) {
      await client.setTokens(await refreshTokens(tokenSet.refreshToken));
    }
    return;
  }

  const authRequest = await client.authorizationRequest({
    endpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    clientId: clientId,
    scope: "https://www.googleapis.com/auth/contacts.readonly"
  });
  const { authorizationCode } = await client.authorize(authRequest);
  await client.setTokens(await fetchTokens(authRequest, authorizationCode));
}

async function fetchTokens(authRequest: OAuth.AuthorizationRequest, authCode: string): Promise<OAuth.TokenResponse> {
  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("code", authCode);
  params.append("verifier", authRequest.codeVerifier);
  params.append("grant_type", "authorization_code");
  params.append("redirect_uri", authRequest.redirectURI);

  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", body: params });
  if (!response.ok) {
    console.error("fetch tokens error:", await response.text());
    throw new Error(response.statusText);
  }
  return (await response.json()) as OAuth.TokenResponse;
}

async function refreshTokens(refreshToken: string): Promise<OAuth.TokenResponse> {
  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("refresh_token", refreshToken);
  params.append("grant_type", "refresh_token");

  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", body: params });
  if (!response.ok) {
    console.error("refresh tokens error:", await response.text());
    throw new Error(response.statusText);
  }
  const tokenResponse = (await response.json()) as OAuth.TokenResponse;
  tokenResponse.refresh_token = tokenResponse.refresh_token ?? refreshToken;
  return tokenResponse;
}


// call google contacts api to search for contacts matching this term
// return array of contacts
export async function fetchContacts(searchTerm: string): Promise<Contact[]> {
  const params = new URLSearchParams();
  params.append("pageSize", "20");
  params.append("query", searchTerm);
  params.append("readMask", "names,emailAddresses,phoneNumbers,urls,photos");
  const url = "https://people.googleapis.com/v1/people:searchContacts?" + params.toString();
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${(await client.getTokens())?.accessToken}`,
    },
  });
  if (!response.ok) {
    console.error("fetch items error:", await response.text());
    throw new Error(response.statusText);
  }

  const json = await (response.json()) as any;
  if (!json?.results) {
    return [];
  }

  return json.results.map((item: any) => {
    const { person } = item;

    if (!person.names || person.names.length === 0) {
      return null;
    }
    const name = person.names[0];

    const emails = (person.emailAddresses || []).map((email: any) => {
      return {
        title: email.formattedType,
        email: email.value
      }
    })



    const id = person.resourceName.split('/')[1];
    const contact: Contact = {
      id,
      contactUrl: `https://contacts.google.com/person/${id}`,
      firstName: name.givenName,
      lastName: name.familyName,
      displayName: name.displayName,
      emails: emails,
      urls: (person.urls || []).map((url: any) => url.value),
      photos: (person.photos || []).map((photo: any) => photo.url),
      phones: (person.phoneNumbers || []).map((phone: any) => {
        return {
          title: phone.formattedType,
          phone: phone.value
        }
      })
    }
    return contact;
  }).filter((item: Contact | null) => item !== null);

}

