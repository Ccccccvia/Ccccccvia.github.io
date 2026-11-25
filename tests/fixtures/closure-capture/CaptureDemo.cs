using System;
using System.Collections.Generic;

class CaptureDemo
{
    static void Main()
    {
        var shared = new List<Action>();
        for (int i = 0; i < 3; i++)
        {
            shared.Add(() => Console.WriteLine(i));
        }

        var separate = new List<Action>();
        for (int i = 0; i < 3; i++)
        {
            int copy = i;
            separate.Add(() => Console.WriteLine(copy));
        }

        foreach (Action callback in shared) callback();
        Console.WriteLine("---");
        foreach (Action callback in separate) callback();
    }
}
