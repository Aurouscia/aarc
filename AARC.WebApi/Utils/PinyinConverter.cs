using EzPinyin;
using System.Text;
using Pinyin;

namespace AARC.WebApi.Utils
{
    public static class PinyinConverter
    {
        public static List<string> MandarinConvert(string x) => PinyinHelper.GetArray(x).ToList();
        public static List<string> CantoneseConvert(string x)
        {
            return Jyutping.Instance
                .HanziToPinyin(x, CanTone.Style.NORMAL, Error.Ignore, false)
                .ConvertAll(y => y.pinyin);
        }
        
        public static string Convert(string text, PinyinConvertOptions options)
        {
            var segs = SplitToSegments(text, options.Rules ?? []);
            List<string> segsConverted = new(segs.Count);
            bool isFirstSeg = true;
            foreach (var seg in segs)
            {
                if (seg.IsFromRule || !seg.IsChinese)
                    segsConverted.Add(seg.Value); //如果是“已被规则转换的”或“非中文字符”，as is
                else
                {
                    string segConverted;
                    Func<string, List<string>> convertFn = options.VariantType switch
                    {
                        PinyinVariantType.Cantonese => CantoneseConvert,
                        _ => MandarinConvert
                    };
                    var convertedArr = convertFn(seg.Value);
                    bool pascal = options.CaseType == PinyinCaseType.Pascal;
                    if (pascal)
                        convertedArr = convertedArr.ConvertAll(x => x.ToPascal());
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
                            PinyinCaseType.FirstUpper => isFirstSeg
                                ? segConverted.ToPascal()
                                : segConverted.ToLower(),
                            _ => segConverted
                        };
                    }
                    segsConverted.Add(segConverted);
                }
                isFirstSeg = false;
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
            var targets = rules.Keys
                .Select(x => new PinyinConvertTarget(x))
                .OrderByDescending(x => x.TargetRaw.Length)
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
                PinyinConvertTarget? matchedTarget = null;
                foreach(var tar in targets)
                {
                    // 如果是仅匹配开头的规则，必须cursor为0
                    if (tar.AtHead && cursor != 0)
                        continue;
                    // 如果是仅匹配结尾的规则，必须span与目标相同
                    if (tar.AtTail)
                    {
                        if (slicedSpan.SequenceEqual(tar.TargetText))
                        {
                            matchedTarget = tar;
                            break;
                        }
                    }
                    // 如果不是仅匹配结尾的规则，span开头处有目标即可
                    else
                    {
                        if (slicedSpan.StartsWith(tar.TargetText))
                        {
                            matchedTarget = tar;
                            break;
                        }
                    }
                }
                if(matchedTarget is PinyinConvertTarget matched)
                {
                    if (tempRaw.Length > 0)
                    {
                        flushTempRaw();
                        tempRaw.Clear();
                    }
                    var value = rules[matched.TargetRaw];
                    res.Add(new(value, isFromRule: true, isChinese: false));
                    cursor += matched.TargetText.Length;
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
        private readonly struct PinyinConvertTarget(string target)
        {
            public string TargetRaw { get; } = target;
            public bool AtHead => TargetRaw.StartsWith('^');
            public bool AtTail => TargetRaw.EndsWith('$');
            public string TargetText { get
                {
                    if (!AtHead && !AtTail)
                        return TargetRaw;
                    int sliceFrom = 0;
                    int sliceLength = TargetRaw.Length;
                    if (AtHead)
                    {
                        sliceFrom = 1;
                        sliceLength -= 1;
                    }
                    if (AtTail)
                        sliceLength -= 1;
                    return TargetRaw.Substring(sliceFrom, sliceLength);
                } 
            }
        }
    }
    public class PinyinConvertOptions
    {
        public Dictionary<string, string>? Rules { get; set; }
        public PinyinCaseType CaseType { get; set; }
        public PinyinVariantType VariantType { get; set; }
        public bool SpaceBetweenChars { get; set; }
    }
    public enum PinyinCaseType
    {
        Pascal = 0,
        AllUpper = 1,
        AllLower = 2,
        FirstUpper = 3
    }
    public enum PinyinVariantType
    {
        Mandarin = 0,
        Cantonese = 1
    }
}
