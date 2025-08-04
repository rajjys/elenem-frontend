export const mockUsers = [
  {
    id: 'user1',
    username: 'Alice',
    profileImageUrl: 'https://eu-central-1-shared-euc1-02.graphassets.com/AH2RQtyfHTnCKzsQ0u8mGz/cmdwuqbdyre6307w3r9exg754', // Example profile pic
  },
  {
    id: 'user2',
    username: 'Bob',
    profileImageUrl: 'https://eu-central-1-shared-euc1-02.graphassets.com/AH2RQtyfHTnCKzsQ0u8mGz/cmdwuqbdmre5t07w3fzlu15qn',
  },
  {
    id: 'user3',
    username: 'Charlie',
    profileImageUrl: 'https://eu-central-1-shared-euc1-02.graphassets.com/AH2RQtyfHTnCKzsQ0u8mGz/cmdwuqbdtre5y07w3pxr955fv',
  },
];

export const mockStatuses = [
  {
    userId: 'user1',
    media: [
      {
        id: 'status1_1',
        type: 'image',
        url: 'https://eu-central-1-shared-euc1-02.graphassets.com/AH2RQtyfHTnCKzsQ0u8mGz/TMCAKiy8SVKBR59s8Ijw',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 mins ago
      },
      {
        id: 'status1_2',
        type: 'image',
        url: 'https://eu-central-1-shared-euc1-02.graphassets.com/AH2RQtyfHTnCKzsQ0u8mGz/h9qDcx9QFmmxhxgCNOGw',
        timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 mins ago
      },
    ],
  },
  {
    userId: 'user2',
    media: [
      {
        id: 'status2_1',
        type: 'image',
        url: 'https://eu-central-1-shared-euc1-02.graphassets.com/AH2RQtyfHTnCKzsQ0u8mGz/aD8H02eT5KhojWgSFoTn', // Example video URL
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 mins ago
      },
    ],
  },
  {
    userId: 'user3',
    media: [
      {
        id: 'status3_1',
        type: 'image',
        url: 'https://eu-central-1-shared-euc1-02.graphassets.com/AH2RQtyfHTnCKzsQ0u8mGz/KaO9mtvmRTyVtR1UGmEw',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      },
      {
        id: 'status3_2',
        type: 'image',
        url: 'https://eu-central-1-shared-euc1-02.graphassets.com/AH2RQtyfHTnCKzsQ0u8mGz/UX6Zz3KTKjHwjZ4ONjRg',
        timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      },
      {
        id: 'status3_3',
        type: 'image',
        url: 'https://eu-central-1-shared-euc1-02.graphassets.com/AH2RQtyfHTnCKzsQ0u8mGz/eoj1KnPsSY6mpvfxKwVi',
        timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
      },
    ],
  },
];
