namespace BTN.Core.Forms;

public static class FormFieldTypes
{
    public const string FirstName = "firstName";
    public const string LastName = "lastName";
    public const string FullName = "fullName";
    public const string Phone = "phone";
    public const string Email = "email";
    public const string Number = "number";
    public const string ShortText = "shortText";
    public const string Note = "note";
    public const string Address = "address";
    public const string City = "city";
    public const string State = "state";
    public const string Country = "country";
    public const string PostalCode = "postalCode";
    public const string Date = "date";
    public const string Dropdown = "dropdown";
    public const string YesNo = "yesNo";
    public const string Checkbox = "checkbox";
    public const string Youtube = "youtube";
    public const string VideoLink = "videoLink";
    public const string Document = "document";
    public const string Website = "website";
    public const string Company = "company";

    public static readonly string[] All =
    [
        FirstName, LastName, FullName, Phone, Email, Number, ShortText, Note,
        Address, City, State, Country, PostalCode, Date, Dropdown, YesNo, Checkbox,
        Youtube, VideoLink, Document, Website, Company
    ];

    public static bool IsKnown(string? type) =>
        !string.IsNullOrWhiteSpace(type) && All.Contains(type.Trim());

    public static bool CollectsAnswer(string type) => type != Youtube;
}
