using System;
using System.IO;
using System.Reflection;
using Xunit;

namespace Code.Tests
{
    public class TestFixture1 : IDisposable
    {

        public MethodInfo testMethod;

        public TestFixture1()
        {
            MethodInfo[] methodInfos = typeof(Program).GetMethods(BindingFlags.Public | BindingFlags.Static);
            foreach (var method in methodInfos)
            {
                var parameters = method.GetParameters();
                if (parameters.Length == 1 && parameters[0].ParameterType == typeof(int))
                {
                    this.testMethod = method;
                    break;
                }
            }
        }

        public void Dispose()
        {
        }
    }

    public class UnitTest1 : IClassFixture<TestFixture1>
    {
        public MethodInfo testMethod;

        public UnitTest1(TestFixture1 fixture)
        {
            this.testMethod = fixture.testMethod;
        }

        [Fact]
        public void Test1()
        {
            int size = 10000;
            object[] parameters = { size };

            int[] arr = (int[])this.testMethod.Invoke(null, parameters);

            float negProp = 0.0f;
            foreach (int el in arr)
            {
                if (el < 0)
                {
                    negProp++;
                }
            }
            negProp /= arr.Length;
            
            Assert.True(negProp > 0.6 && negProp < 0.7,
                "Распределение отрицательных/положительных чисел не 1 к 2. А должно быть");

        }

        [Fact]
        public void Test2()
        {
            int size = 1000;
            object[] parameters = { size };

            int[] arr = (int[])this.testMethod.Invoke(null, parameters);

            bool incorrectValue = false;
            foreach (int el in arr)
            {
                if (el < -20 || el > 10)
                {
                    incorrectValue = true;
                    break;
                }
            }

            Assert.False(incorrectValue,
                "Как сюда попали эти левые числа вне допустимого диапазона???");
        }

        [Fact]
        public void Test3()
        {
            int size = 10000;
            object[] parameters = { size };

            int[] arr = (int[])this.testMethod.Invoke(null, parameters);

            float posProp = 0.0f;
            foreach (int el in arr)
            {
                if (el >= 0)
                {
                    posProp++;
                }
            }
            posProp /= arr.Length;

            Assert.True(posProp > 0.3 && posProp < 0.4,
                "Распределение отрицательных/положительных чисел не 1 к 2. А должно быть");

        }


    }
}