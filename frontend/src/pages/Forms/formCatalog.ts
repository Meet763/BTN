export type FormFieldType =
  | 'firstName'
  | 'lastName'
  | 'fullName'
  | 'phone'
  | 'email'
  | 'number'
  | 'shortText'
  | 'note'
  | 'address'
  | 'city'
  | 'state'
  | 'country'
  | 'postalCode'
  | 'date'
  | 'dropdown'
  | 'yesNo'
  | 'checkbox'
  | 'youtube'
  | 'videoLink'
  | 'document'
  | 'website'
  | 'company';

export interface FieldValidation {
  minLength?: number | null;
  maxLength?: number | null;
  min?: number | null;
  max?: number | null;
  maxFileMb?: number | null;
  extensions?: string[];
}

export interface FieldDraft {
  fieldKey: string;
  fieldType: FormFieldType;
  label: string;
  hint: string;
  placeholder: string;
  isRequired: boolean;
  options: string[];
  validation: FieldValidation;
  settings: { youtubeUrl?: string };
}

export interface ManagedFormDraft {
  id?: string;
  name: string;
  slug: string;
  description: string;
  introTitle: string;
  introBody: string;
  submitLabel: string;
  isPublished: boolean;
  fields: FieldDraft[];
}

export const FIELD_CATALOG: {
  type: FormFieldType;
  name: string;
  blurb: string;
  label: string;
  hint: string;
  placeholder: string;
  required: boolean;
}[] = [
  { type: 'firstName', name: 'First name', blurb: 'Given name only.', label: 'What’s your first name?', hint: 'The name people call you.', placeholder: 'Asha', required: true },
  { type: 'lastName', name: 'Last name', blurb: 'Family name.', label: 'What’s your last name?', hint: 'Surname or family name.', placeholder: 'Patel', required: true },
  { type: 'fullName', name: 'Full name', blurb: 'First and last name together.', label: 'What’s your full name?', hint: 'First and last name.', placeholder: 'Asha Patel', required: true },
  { type: 'phone', name: 'Phone number', blurb: 'Mobile number, 7 to 15 digits.', label: 'Your phone number?', hint: 'Include the country code if you are outside India.', placeholder: '9876543210', required: true },
  { type: 'email', name: 'Email', blurb: 'Must look like an email address.', label: 'Your email?', hint: 'We’ll send updates here.', placeholder: 'you@email.com', required: true },
  { type: 'number', name: 'Number', blurb: 'A quantity, age, or amount. Set min and max if you need them.', label: 'Enter a number', hint: 'Numbers only.', placeholder: '1', required: true },
  { type: 'shortText', name: 'Short text', blurb: 'One line, such as a company or city nickname.', label: 'Tell us in a few words', hint: '', placeholder: '', required: false },
  { type: 'note', name: 'Note', blurb: 'A longer answer. Use the note to explain what the person should write.', label: 'What are you interested in?', hint: 'Write a short note in your own words. Example: “Home solar for a 2BHK” or “A sales role in Ahmedabad.”', placeholder: 'What you want, in a sentence', required: false },
  { type: 'address', name: 'Address', blurb: 'Street address for delivery or contact.', label: 'Your address?', hint: 'House, street, and area.', placeholder: 'Flat, street, area', required: true },
  { type: 'city', name: 'City', blurb: 'City or town.', label: 'Which city?', hint: 'City or town.', placeholder: 'Ahmedabad', required: true },
  { type: 'state', name: 'State', blurb: 'Searchable list of states and regions worldwide.', label: 'Which state or region?', hint: 'Search by state or country. This list is worldwide, not only India.', placeholder: 'Search for your state', required: true },
  { type: 'country', name: 'Country', blurb: 'Searchable country list.', label: 'Which country?', hint: 'Search and pick your country.', placeholder: 'Search for your country', required: true },
  { type: 'postalCode', name: 'Postal code', blurb: 'PIN, ZIP, or other postal code.', label: 'Your postal code?', hint: 'PIN, ZIP, or the code used where you live.', placeholder: '380001', required: true },
  { type: 'date', name: 'Date', blurb: 'A calendar date.', label: 'Pick a date', hint: '', placeholder: '', required: false },
  { type: 'dropdown', name: 'Dropdown', blurb: 'One choice from a list you write.', label: 'Choose one', hint: 'Pick the option that fits best.', placeholder: 'Select an option', required: true },
  { type: 'yesNo', name: 'Yes / No', blurb: 'A simple yes or no question.', label: 'Would you like us to contact you?', hint: '', placeholder: 'Select an option', required: false },
  { type: 'checkbox', name: 'Checkbox', blurb: 'A confirmation, such as agreeing to be contacted.', label: 'I agree to be contacted about this', hint: 'Tick this if you want a follow-up.', placeholder: '', required: false },
  { type: 'youtube', name: 'YouTube video', blurb: 'Shows a video you choose. People watch it; they do not type an answer.', label: 'Watch this first', hint: 'Play the video, then continue.', placeholder: '', required: false },
  { type: 'videoLink', name: 'YouTube link', blurb: 'The person pastes their own YouTube video link.', label: 'Paste a YouTube link', hint: 'A link like https://www.youtube.com/watch?v=…', placeholder: 'https://www.youtube.com/watch?v=', required: false },
  { type: 'document', name: 'Document upload', blurb: 'PDF, image, or Word file. Set the size and allowed types.', label: 'Upload a document', hint: 'PDF, image, or Word file.', placeholder: '', required: false },
  { type: 'website', name: 'Website', blurb: 'A link starting with https://.', label: 'Your website?', hint: 'Include https://', placeholder: 'https://', required: false },
  { type: 'company', name: 'Company', blurb: 'Organisation or business name.', label: 'Company name?', hint: 'The business you work with, if any.', placeholder: 'Company', required: false },
];

export const catalogItem = (type: string) => FIELD_CATALOG.find((item) => item.type === type);

export const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

export const nextFieldKey = (type: string, fields: FieldDraft[]) => {
  const used = new Set(fields.map((field) => field.fieldKey));
  if (!used.has(type)) return type;
  let n = 2;
  while (used.has(`${type}${n}`)) n += 1;
  return `${type}${n}`;
};

export const draftFromType = (type: FormFieldType, fields: FieldDraft[]): FieldDraft => {
  const item = catalogItem(type)!;
  return {
    fieldKey: nextFieldKey(type, fields),
    fieldType: type,
    label: item.label,
    hint: item.hint,
    placeholder: item.placeholder,
    isRequired: item.required,
    options: type === 'dropdown' ? ['Option 1', 'Option 2'] : [],
    validation: type === 'document' ? { maxFileMb: 8, extensions: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'] } : {},
    settings: {},
  };
};

export const emptyForm = (): ManagedFormDraft => ({
  name: '',
  slug: '',
  description: '',
  introTitle: 'Tell us a little about you',
  introBody: 'One question at a time. You can go back and change an answer.',
  submitLabel: 'Submit',
  isPublished: false,
  fields: [],
});
