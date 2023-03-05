import { List, Detail, Toast, showToast, Icon, ActionPanel, Action } from "@raycast/api";
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
        setItems(contacts);
        setIsLoading(false);        
      } catch (error) {
        console.error(error);
        setIsLoading(false);
        showToast({ style: Toast.Style.Failure, title: String(error) });
      }
    })();
  }, [searchText]);


  return (
    <List 
      isLoading={isLoading} 
      onSearchTextChange={setSearchText} 
      searchText={searchText}
      searchBarPlaceholder="Search Google Contacts" 
      throttle isShowingDetail>
      {searchText === ""  && <List.EmptyView title="Search Google Contacts" />}
      {items.map((contact: google.Contact) => {
        return <List.Item 
          key={contact.id}
          actions={ContactActions(contact)}
          title={contact.displayName}
          detail={ContactDetail(contact)}          
        />;
      })}
    </List>
  );
}

function ContactDetail(contact: google.Contact): JSX.Element {
  const markdown = `# ${contact.displayName} \n\n`+
    contact.urls.map((url) => `[${url}](${url})`).join("\n") + "\n\n" 

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

function ContactActions(contact: google.Contact): JSX.Element {
  return (
    <ActionPanel>
      <Action.OpenInBrowser 
        icon={Icon.Person}
        url={contact.contactUrl} 
        title="Show in Google Contacts"/>
      <ActionPanel.Section title="Copy to Clipboard">
      {contact.emails.map((email) => (
        <Action.CopyToClipboard key={email.email} icon={Icon.Envelope} title={email.email} content={email.email} />
      ))}
      {contact.phones.map((phone) => (
        <Action.CopyToClipboard key={phone.phone} icon={Icon.Phone} title={phone.phone} content={phone.phone} />
      ))}
      </ActionPanel.Section>
    </ActionPanel>
  );
} 