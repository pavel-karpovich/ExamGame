using System;
using System.IO;
using Xunit;

namespace Code.Tests
{

    public class UnitTest1
    {

        [Fact]
        public void Test1()
        {
            var output = new StringWriter();
            Console.SetOut(output);

            var input = new StringReader("Носорог");
            Console.SetIn(input);

            Code.Program.Main(null);

            Assert.True(output.ToString() == string.Format("Пароль принят{0}", Environment.NewLine),
                "Носорог. Я сказал \"Носорог\"... \"Носорог\"! Ау!!");
        }

        [Fact]
        public void Test2()
        {
            var output = new StringWriter();
            Console.SetOut(output);

            var input = new StringReader("носорог");
            Console.SetIn(input);
            
            Code.Program.Main(null);

            Assert.True(output.ToString() != string.Format("Пароль принят{0}", Environment.NewLine),
                "носорог это не Носорог");
        }

        [Fact]
        public void Test3()
        {
            var output = new StringWriter();
            Console.SetOut(output);

            var input = new StringReader("Орангутан");
            Console.SetIn(input);
            
            Code.Program.Main(null);

            Assert.True(output.ToString() == string.Format("Держись отсюда подальше{0}", Environment.NewLine),
                "Когда вы успели поменять пароль???");
        }

        [Fact]
        public void Test4()
        {
            var output = new StringWriter();
            Console.SetOut(output);

            var input = new StringReader("Мезозой");
            Console.SetIn(input);

            Code.Program.Main(null);

            Assert.True(output.ToString() == string.Format("Держись отсюда подальше{0}", Environment.NewLine) ||
                output.ToString() == string.Format("Пароль принят{0}", Environment.NewLine),
                "Может быть всего 2 варианта ответа! Почему на вывод идёт что-то третье?");
        }

    }
}