using System;
using Xunit;

namespace Code.Tests
{
    public class UnitTest1
    {
        [Fact]
        public void Test1()
        {
            int[] arr = { 1, 2, 3, 4, 5, 6, 7 };

            int sum = Code.Program.ArraySum(arr);
            int realSum = 28;

            Assert.True(sum == realSum, "Для массива { 1, 2, 3, 4, 5, 6, 7 } что-то пошло нет так!");
        }

        [Fact]
        public void Test2()
        {
            int[] arr = { };

            int sum = Code.Program.ArraySum(arr);
            int realSum = 0;

            Assert.True(sum == realSum, "Почему для пустого массива результат не 0?");
        }

        [Fact]
        public void Test3()
        {
            int[] arr = { -3, 8, -3, -2, 1, -4, 3 };

            int sum = Code.Program.ArraySum(arr);
            int realSum = 0;

            Assert.True(sum == realSum, "В чём проблема с массивом { -3, 8, -3, -2, 1, -4, 3 }?");
        }

    }
}