export const bootstrapInvitations = [
  {
    id: 201,
    inviterId: 1,
    inviterUsername: 'alpha',
    inviteeUsername: 'bravo',
    status: 'accepted',
    createdAt: '2025-12-15T18:00:00Z',
    acceptedAt: '2025-12-15T18:30:00Z'
  },
  {
    id: 202,
    inviterId: 1,
    inviterUsername: 'alpha',
    inviteeUsername: 'charlie',
    status: 'pending',
    createdAt: '2025-12-18T14:10:00Z',
    acceptedAt: null
  }
];

export const bootstrapConfig = {
  eventDate: '2026-02-01T20:00',
  maxParticipants: 180,
  memberCountReleaseDate: '2026-01-10T10:00',
  ticketPrice: 50,
  currency: 'USD',
  maxInvitesPerUser: 5,
  maxDiscountPercent: 15
};
