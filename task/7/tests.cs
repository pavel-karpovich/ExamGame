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
            foreach(var method in methodInfos)
            {
                var parameters = method.GetParameters();
                if (parameters.Length == 2 && parameters[0].ParameterType == typeof(DateTime) && parameters[1].ParameterType == typeof(DateTime))
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
            DateTime d1 = new DateTime(1999, 11, 4);
            DateTime d2 = new DateTime(2000, 1, 18);
            object[] parameters = { d1, d2 };

            int difference = (int)this.testMethod.Invoke(null, parameters);
            int desired = 75;

            Assert.True(difference == desired, "Почему это разница между датами " + d1.ToShortDateString() +
                " и " + d2.ToShortDateString() + " составляет не 75 дней?");
        }

        [Fact]
        public void Test2()
        {
            DateTime d1 = new DateTime(2000, 1, 18);
            DateTime d2 = new DateTime(1999, 11, 4);
            object[] parameters = { d1, d2 };

            int difference = (int)this.testMethod.Invoke(null, parameters);
            int desired = 75;

            Assert.True(difference == desired, "Почему это разница между датами " + d2.ToShortDateString() +
                " и " + d1.ToShortDateString() + " составляет не 75 дней?");
        }

        [Fact]
        public void Test3()
        {
            DateTime d1 = DateTime.Now;
            object[] parameters = { d1, d1 };

            int difference = (int)this.testMethod.Invoke(null, parameters);
            int desired = 0;

            Assert.True(difference == desired, "Между одним и тем же днём никак не должно быть разницы...");
        }

        [Fact]
        public void Test4()
        {
            DateTime d1 = new DateTime(2020, 2, 2);
            DateTime d2 = new DateTime(1987, 10, 10);
            object[] parameters = { d1, d2 };

            int difference = (int)this.testMethod.Invoke(null, parameters);
            int desired = 11803;

            Assert.True(difference == desired, "C большими диапазонами что-то случилось... " +
                d1.ToShortDateString() + " и " + d2.ToShortDateString() + " не работают");
        }

    }
}