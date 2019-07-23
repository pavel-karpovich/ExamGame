using System;
using System.IO;
using Xunit;

namespace Code.Tests
{

    public class UnitTest1
    {

        private static bool CompareArrByValue(int[] a1, int[] a2)
        {
            if (a1.Length != a2.Length)
            {
                return false;
            }
            for (int i = 0; i < a1.Length; i++)
            {
                if (a1[i] != a2[i])
                {
                    return false;
                }
            }
            return true;
        }

        [Fact]
        public void Test1()
        {
            int[] arr = { 2, 5, 8, 2, 93, 13, 5, 4 };
            int lower = 5;

            int[] res = Code.Program.ArrayFilterLower(arr, lower);
            int[] target = { 2, 2, 4 };

            Assert.True(CompareArrByValue(res, target), "Даже с таким массивом что-то не работает: { " +
                string.Join(", ", arr) + " } и число " + lower);
        }

        [Fact]
        public void Test2()
        {
            int[] arr = { 5, -13, -6, 23, -19, 9, -4, 0, -94, -72, 18 };
            int lower = -5;

            int[] res = Code.Program.ArrayFilterLower(arr, lower);
            int[] target = { -13, -6, -19, -94, -72 };

            Assert.True(CompareArrByValue(res, target), "Отрицательные не проходят: { " +
                string.Join(", ", arr) + " } (вместе с " + lower +"), проверь всё ещё раз");
        }

        [Fact]
        public void Test3()
        {
            int[] arr = { 10, 128, -954, 23, -453, -54, 12, 84, 290 };
            int lower = 50000;

            int[] res = Code.Program.ArrayFilterLower(arr, lower);
            int[] target = { 10, 128, -954, 23, -453, -54, 12, 84, 290 };

            Assert.True(CompareArrByValue(res, target), "С большими числами беда: { " +
                string.Join(", ", arr) + " } (с числом " + lower + ")");
        }

        [Fact]
        public void Test4()
        {
            int[] arr = { };
            int lower = 50;

            int[] res = Code.Program.ArrayFilterLower(arr, lower);
            int[] target = { };

            Assert.True(CompareArrByValue(res, target), "Пустой массив приводит к неприятностями...");
        }

        [Fact]
        public void Test5()
        {
            int[] arr = { 0, 0, 0, 0, 0, 0, 0, 0 };
            int lower = 0;

            int[] res = Code.Program.ArrayFilterLower(arr, lower);
            int[] target = { };

            Assert.True(CompareArrByValue(res, target), "Ноль-ноль-ноль-ноль-ноль-ноль......");
        }

    }
}