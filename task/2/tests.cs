using System;
using Xunit;

namespace Code.Tests
{
    public class UnitTest1
    {
        [Fact]
        public void Test1()
        {
            int a = 40;
            int b = 30;

            double hyp = Math.Round((double)Code.Program.GetHypotenuse(a, b), 4);
            double realhyp = Math.Round(Math.Sqrt(a * a + b * b), 4);

            Assert.True(hyp == realhyp, "ƒл€ целых чисел, таких как " + a + " и " + b + ", что-то работает неверно");
        }

        [Fact]
        public void Test2()
        {
            double a = 4.25;
            double b = 3.7;

            double hyp = Math.Round((double)Code.Program.GetHypotenuse(a, b), 4);
            double realhyp = Math.Round(Math.Sqrt(a * a + b * b), 4);

            Assert.True(realhyp == hyp, "Ќеправильно работает с числами типа double " + a + " и " + b);
        }

        [Fact]
        public void Test3()
        {
            float a = 0.12f;
            float b = 3.94f;

            double hyp = Math.Round((float)Code.Program.GetHypotenuse(a, b), 4);
            double realhyp = Math.Round(Math.Sqrt(a * a + b * b), 4);
            Assert.True(realhyp == hyp, "ј вот с этими float-ами что-то пошло не так: " + a + ", " + b);
        }

    }
}