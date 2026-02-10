export type FamilyMemberRow = {
  id: string;
  name: string;
  color: string;
};

export type RelationshipRow = {
  member_id: string;
  related_id: string;
  relationship_type: string;
};
