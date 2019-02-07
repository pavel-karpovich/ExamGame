using System;
using System.IO;
using System.Reflection;
using Xunit;

namespace Code.Tests
{
    public class UnitTest1
    {
        [Fact]
        public void Test1()
        {
            string[] arr = { "Петя", "Серёжа", "Ника", "Сева", "Лёша" };
            string sep = " и ";

            string join = Code.Program.JoinString(sep, arr);
            string desired = "Петя и Серёжа и Ника и Сева и Лёша";

            Assert.True(join == desired, "Ничего не работает...");
        }

        [Fact]
        public void Test2()
        {
            string[] arr = { "А воз и ныне там" };
            string sep = "лишнее";

            string join = Code.Program.JoinString(sep, arr);
            string desired = arr[0];

            Assert.True(join == desired, "Если в массиве меньше 2 строк, разделитель не должен использоваться");
        }

        [Fact]
        public void Test3()
        {
            string[] arr = { "Камень", "Ножницы", "Бумага" };
            string sep = ",";

            string join = Code.Program.JoinString(sep, arr);
            int delCount = join.Split(sep).Length - 1;
            int desired = 2;

            Assert.True(delCount == desired, "Для трёх слов должно быть вставлено 2 разделителя");
        }
        
    }
}