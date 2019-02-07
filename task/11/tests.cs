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
                if (parameters.Length == 4 && parameters[0].ParameterType == typeof(int) &&
                    parameters[1].ParameterType == typeof(int) && parameters[2].ParameterType == typeof(int) &&
                    parameters[3].ParameterType == typeof(int))
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
            int king_x = 2, king_y = 2;
            int knight_x = 4, knight_y = 3;
            object[] parameters = { king_x, king_y, knight_x, knight_y };

            bool res = (bool)this.testMethod.Invoke(null, parameters);
            
            Assert.True(res, "Король (2;2), конь (4;3) - должен быть шах");

        }

        [Fact]
        public void Test2()
        {
            int king_x = 1, king_y = 3;
            int knight_x = 3, knight_y = 7;
            object[] parameters = { king_x, king_y, knight_x, knight_y };

            bool res = (bool)this.testMethod.Invoke(null, parameters);

            Assert.False(res, "Король (1;3), конь (3;7) - Никакого воздействия не должно быть");

        }

        [Fact]
        public void Test3()
        {
            int king_x = -2, king_y = -4;
            int knight_x = 3, knight_y = 7;
            object[] parameters = { king_x, king_y, knight_x, knight_y };

            bool res = (bool)this.testMethod.Invoke(null, parameters);

            Assert.False(res, "Короля на позицию -7:43, пожалуйста!");

        }

    }
}