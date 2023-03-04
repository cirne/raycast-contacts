import { List, Detail, Toast, showToast, Icon } from "@raycast/api";
import * as google from "./google";
import { useState, useEffect } from "react";

export default function Command() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [items, setItems] = useState<google.Contact[]>([]);
  const [searchText, setSearchText] = useState<string>("");


  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        await google.authorize();
        const contacts = await google.fetchContacts(searchText);
        console.log("contacts", contacts);
        setItems(contacts);
        setIsLoading(false);
      } catch (error) {
        console.error(error);
        setIsLoading(false);
        showToast({ style: Toast.Style.Failure, title: String(error) });
      }
    })();
  }, [searchText]);

  if (isLoading) {
    return <Detail isLoading={isLoading} />;
  }

  return (
    <List isLoading={isLoading} onSearchTextChange={setSearchText} searchBarPlaceholder="Search Google Contacts" throttle isShowingDetail>
      {items.map((contact: google.Contact) => {
        return <List.Item 
          key={contact.id}
          title={contact.displayName}
          detail={ContactDetail(contact)}          
        />;
      })}
    </List>
  );
}

function ContactDetail(contact: google.Contact): JSX.Element {
  const markdown = `# ${contact.displayName} `

  return (
    <List.Item.Detail
      markdown={markdown}
      metadata={
        <Detail.Metadata>
          {contact.emails.map((email) => {
            return <Detail.Metadata.Label 
              key={email.email} 
              title={email.title || "Email"} 
              icon={Icon.Envelope} 
              text={email.email} />
          })}
          {contact.phones.map((phone) => {
            return <Detail.Metadata.Label 
              key={phone.phone} 
              title={phone.title || "Phone"} 
              icon={Icon.Phone} 
              text={phone.phone} />
          })}
        </Detail.Metadata>
      }

    />
  )
}