export async function createGoogleDoc(title: string, textContent: string, accessToken: string) {
  // 1. Create a new document
  const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: title,
    }),
  });

  if (!createRes.ok) {
    throw new Error('Failed to create Google Doc');
  }

  const doc = await createRes.json();
  const documentId = doc.documentId;

  // 2. Insert text into the document
  const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          insertText: {
            location: {
              index: 1,
            },
            text: textContent,
          },
        },
      ],
    }),
  });

  if (!updateRes.ok) {
    throw new Error('Failed to update Google Doc');
  }

  return `https://docs.google.com/document/d/${documentId}/edit`;
}
