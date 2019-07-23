using System;
using System.IO;
using System.Reflection;
using Xunit;

namespace Code.Tests
{
    public class TestFixture1 : IDisposable
    {

        public Type testClass;

        public TestFixture1()
        {
            this.testClass = typeof(Code.User);
        }

        public void Dispose()
        {
        }
    }

    public class UnitTest1 : IClassFixture<TestFixture1>
    {
        public Type testClass;

        public UnitTest1(TestFixture1 fixture)
        {
            this.testClass = fixture.testClass;
        }

        [Fact]
        public void Test1()
        {

            PropertyInfo[] properties = testClass.GetProperties();
            
            Assert.True(properties.Length > 6, "Слишком мало свойств");

        }

        [Fact]
        public void Test2()
        {
            ConstructorInfo[] constructors = testClass.GetConstructors();

            Assert.True(constructors.Length > 2, "Мало конструкторов!");

        }

        [Fact]
        public void Test3()
        {
            ConstructorInfo[] constructors = testClass.GetConstructors();
            User user = null;
            foreach (var constr in constructors)
            {
                if (constr.GetParameters().Length == 0)
                {
                    user = (User)constr.Invoke(new object[] { });
                }
            }

            Assert.True(user != null, "И куда это у нас подевался конструктор по умолчанию?");

        }


    }
}