namespace AARC.Models.DbModels.Enums.AuthGrantTypes;

public enum AuthGrantTypeOfSave : byte
{
    Unknown = 0,
    View = 1,
    ExportImage = 2,
    ExportJson = 3,
    Edit = 4,
    Comment = 5
}