
export type Contact = {
    id: string;
    contactUrl: string;
    firstName: string;
    lastName: string;
    displayName: string;
    urls: string[];
    photos: string[];
    emails: { title: string; email: string }[];
    phones: { title: string; phone: string }[];
  };
  