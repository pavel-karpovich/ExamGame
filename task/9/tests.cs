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
                if (parameters.Length == 1 && parameters[0].ParameterType == typeof(float[]))
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
            float[] val = { 2.4f, 1.46f, 2.834f, 12.63f, 4.4f, 65.233f };
            object[] parameters = { val };

            float avg = (float)Math.Round((float)this.testMethod.Invoke(null, parameters));
            float desired = (float)Math.Round(14.8261671);

            Assert.True(avg == desired, "Среднее значение считается как-то очень странно...");
        }

        [Fact]
        public void Test2()
        {
            float[] val = {  };
            object[] parameters = { val };

            float avg = (float)Math.Round((float)this.testMethod.Invoke(null, parameters));

            Assert.True(float.IsNaN(avg), "Пустой массив - что, не массив?");
        }

        [Fact]
        public void Test3()
        {
            float[] val = { -3.13f, -0.34f, 38f, 1.43f, -44.2f, -37.48f };
            object[] parameters = { val };

            float avg = (float)Math.Round((float)this.testMethod.Invoke(null, parameters));
            float desired = (float)Math.Round(-8.0f);

            Assert.True(avg == desired, "Массив с отрицательными значениями не хочет дружить с вашим алгоритмом");
        }


    }
}