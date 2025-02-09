namespace AARC.Models.Dto
{
    public class SaveDto
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? MiniUrl { get; set; }
        public string? Version { get; set; }
        public int OwnerUserId { get; set; }
        public string? OwnerName { get; set; }
        public string? Intro { get; set; }
        public int StaCount { get; set; }
        public int LineCount { get; set; }
        public byte Priority { get; set; }
        public string? LastActive { get; set; }

        public SaveDto() { }
        public SaveDto(
            int id, string name, string? version, int ownerId,
            string? intro, DateTime lastActive, int staCount, int lineCount)
        {
            Id = id;
            Name = name;
            Version = version;
            OwnerUserId = ownerId;
            Intro = intro;
            LastActive = lastActive.ToString("yyyy-MM-dd HH:mm");
            StaCount = staCount;
            LineCount = lineCount;
        }
    }
}
