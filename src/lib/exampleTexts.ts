export interface ExampleText {
  id: string
  label: string
  description: string
  content: string
}

export const EXAMPLE_TEXTS: ExampleText[] = [
  {
    id: 'alice-top-artists',
    label: "Alice's top artists",
    description: 'A mix of musical artists for comparison, cleaning, sorting and filtering.',
    content: `The Beatles
Dua Lipa
Metallica
Adele
Shakira
  David Bowie
Daft Punk
Ed Sheeran
Téléphone
Queens of the Stone Age`,
  },
  {
    id: 'bob-top-artists',
    label: "Bob's top artists",
    description: 'Another mix of musical artists to use in combination with Alice\'s top artists.',
    content: `Beyoncé
Daft Punk
The Weeknd
Téléphone 
Drake
Daft Punk
Queens of the stone age
David Guetta`,
  },
  {
    id: 'lorem-variations',
    label: 'Lorem ipsum variations',
    description: 'Mixed-length lorem ipsum lines with occasional leading or trailing spaces.',
    content: `Lorem ipsum dolor sit amet,
consectetur adipiscing elit.
 Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae.
Fusce ut placerat orci nulla pellentesque dignissim enim sit amet. 
  Etiam non quam lacus suspendisse faucibus interdum posuere lorem.
 Curabitur non nulla sit amet nisl tempus convallis quis ac lectus.  
Phasellus vestibulum lorem sed risus ultricies tristique nulla aliquet.
Pellentesque habitant morbi tristique senectus et netus et malesuada fames.
Nullam eget felis eget nunc lobortis mattis aliquam faucibus purus in.
  Mauris vitae ultricies leo integer malesuada nunc vel risus commodo viverra.`,
  },
  {
    id: 'csv-contacts',
    label: 'Sample contacts (CSV)',
    description: 'Quick dataset for experimenting with filtering and column extraction.',
    content: `Name,Email,Role
Alice Smith,alice@example.com,Admin
Bob Lee,bob@example.com,Editor
Cara King,cara@example.com,Viewer
David Yan,david@example.com,Guest`,
  },
  {
    id: 'log-snippet',
    label: 'Application logs',
    description: 'Mixed log levels for search and comparison workflows.',
    content: `2024-07-08 08:42:01 INFO  Starting background job
2024-07-08 08:42:05 WARN  Cache miss for key "user:483"
2024-07-08 08:42:07 ERROR Failed to process order #5921
2024-07-08 08:42:08 INFO  Retrying in 5s`,
  },
  {
    id: 'markdown-checklist',
    label: 'Markdown checklist',
    description: 'Great for testing search modes and transformations.',
    content: `# Release Checklist
- [x] Draft release notes
- [ ] Update version number
- [ ] Smoke test staging
- [ ] Post announcement`,
  },
]
