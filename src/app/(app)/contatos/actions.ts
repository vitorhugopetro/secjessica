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

export async function deleteContact(id: string, orgId: string) {
  return _deleteContact(id, orgId);
}

export async function importContactsCSV(orgId: string, csvContent: string) {
  return _importContactsCSV(orgId, csvContent);
}

export async function exportContactsCSV(orgId: string) {
  return _exportContactsCSV(orgId);
}
