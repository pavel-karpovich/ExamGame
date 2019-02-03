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

            int max = Code.Program.Max(a, b);

            Assert.True(max == a, "Неправильно работает с параметрами " + a + " и " + b);
        }

        [Fact]
        public void Test2()
        {
            int a = 30;
            int b = 40;

            int max = Code.Program.Max(a, b);

            Assert.True(max == b, "Неправильно работает с параметрами " + a + " и " + b);
        }

        [Fact]
        public void Test3()
        {
            int a = -3;
            int b = -17;

            int max = Code.Program.Max(a, b);

            Assert.True(max == a, "Неправильно работает с параметрами " + a + " и " + b);
        }

        [Fact]
        public void Test4()
        {
            int a = 0;
            int b = 0;

            int max = Code.Program.Max(a, b);

            Assert.True(max == a, "Неправильно работает с параметрами " + a + " и " + b);
        }

    }
}