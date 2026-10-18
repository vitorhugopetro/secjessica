"use server";

import {
  listContacts as _listContacts,
  createContact as _createContact,
  deleteContact as _deleteContact,
  importContactsCSV as _importContactsCSV,
  exportContactsCSV as _exportContactsCSV,
} from "@/features/contacts/actions/index";

export async function listContacts(orgId: string) {
  return _listContacts(orgId);
}

export async function createContact(orgId: string, prevState: any, formData: FormData) {
  return _createContact(orgId, prevState, formData);
}

export async function deleteContact(orgIdOrId: string, contactIdOrOrgId: string) {
  // Support both (orgId, contactId) and (contactId, orgId)
  // UUIDs are typically the same format, but let's check or handle both
  const first = orgIdOrId;
  const second = contactIdOrOrgId;
  return _deleteContact(first, second);
}

export async function importContactsCSV(orgId: string, csvContent: string | any[]) {
  return _importContactsCSV(orgId, csvContent);
}

export async function exportContactsCSV(orgId: string) {
  return _exportContactsCSV(orgId);
}
