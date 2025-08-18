using EzPinyin;
using System.Text;

namespace AARC.Utils
{
    public static class PinyinConverter
    {
        public static string Convert(string text, PinyinConvertOptions options)
        {
            var segs = SplitToSegments(text, options.Rules ?? []);
            List<string> segsConverted = new(segs.Count);
            foreach (var seg in segs)
            {
                if (seg.IsFromRule || !seg.IsChinese)
                    segsConverted.Add(seg.Value); //如果是“已被规则转换的”或“非中文字符”，as is
                else
                {
                    string segConverted;
                    var convertedArr = PinyinHelper.GetArray(seg.Value);
                    bool pascal = options.CaseType == PinyinCaseType.Pascal;
                    if (pascal)
                        convertedArr = convertedArr.Select(x => x.ToPascal()).ToArray();
                    if (options.SpaceBetweenChars)
                        segConverted = string.Join(' ', convertedArr);
                    else
                        segConverted = string.Concat(convertedArr);
                    if (!pascal)
                    {
                        segConverted = options.CaseType switch
                        {
                            PinyinCaseType.AllUpper => segConverted.ToUpper(),
                            PinyinCaseType.AllLower => segConverted.ToLower(),
                            _ => segConverted
                        };
                    }
                    segsConverted.Add(segConverted);
                }
            }
            string res = string.Join(" ", segsConverted);
            return res;
        }
        private static List<PinyinSegment> SplitToSegments(string text, Dictionary<string, string> rules)
        {
            List<PinyinSegment> res = [];
            rules = rules
                .Select(x => new KeyValuePair<string, string>(x.Key.Trim(), x.Value.Trim()))
                .Where(x => x.Key.Length > 0) //排除长度为0的Key，否则会死循环
                .ToDictionary();
            var keys = rules.Keys
                .OrderByDescending(x => x.Length)
                .ToList();
            ReadOnlySpan<char> targetSpan = text;
            int cursor = 0;
            StringBuilder tempRaw = new();
            bool tempRawIsChinese = false;
            void flushTempRaw()
            {
                if (tempRaw.Length > 0)
                    res.Add(new(tempRaw.ToString(), isFromRule: false, isChinese: tempRawIsChinese));
                tempRaw.Clear();
            }
            while (cursor < text.Length)
            {
                ReadOnlySpan<char> slicedSpan = targetSpan[cursor..];
                string? matchedKey = null;
                foreach(var key in keys)
                {
                    if (slicedSpan.StartsWith(key))
                    {
                        matchedKey = key;
                        break;
                    }
                }
                if(matchedKey is { })
                {
                    if (tempRaw.Length > 0)
                    {
                        flushTempRaw();
                        tempRaw.Clear();
                    }
                    var value = rules[matchedKey];
                    res.Add(new(value, isFromRule: true, isChinese: false));
                    cursor += matchedKey.Length;
                }
                else
                {
                    var firstChar = slicedSpan[0];
                    var isChnChar = firstChar.IsChinese();
                    if(isChnChar != tempRawIsChinese)
                    {
                        flushTempRaw();
                        tempRawIsChinese = isChnChar;
                    }
                    tempRaw.Append(slicedSpan[0]);
                    cursor++;
                }
            }
            flushTempRaw();
            return res;
        }

        private static string ToPascal(this string input)
        {
            if (string.IsNullOrEmpty(input))
                return string.Empty;
            int len = input.Length;
            char[] chars = new char[len];
            chars[0] = char.ToUpper(input[0]);
            for (int i = 1; i < len; i++)
                chars[i] = char.ToLower(input[i]);
            return new string(chars);
        }

        private static bool IsChinese(this char c)
        {
            return (c >= '\u4E00' && c <= '\u9FFF') ||
                (c >= '\u3400' && c <= '\u4DBF');
        }

        private readonly struct PinyinSegment(
            string value, bool isFromRule, bool isChinese)
        {
            public string Value { get; } = value;
            public bool IsFromRule { get; } = isFromRule;
            public bool IsChinese { get; } = isChinese;
        }
    }
    public class PinyinConvertOptions
    {
        public Dictionary<string, string>? Rules { get; set; }
        public PinyinCaseType CaseType { get; set; }
        public bool SpaceBetweenChars { get; set; }
    }
    public enum PinyinCaseType
    {
        Pascal = 0,
        AllUpper = 1,
        AllLower = 2
    }
}
