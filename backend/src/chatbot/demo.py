"""
Demo script to test Storm Tracker Chatbot
"""
import asyncio
import httpx
from rich.console import Console
from rich.panel import Panel
from rich.markdown import Markdown

console = Console()

async def test_chatbot():
    """Test chatbot functionality"""
    base_url = "http://localhost:8000"
    
    console.print("\n[bold cyan]🤖 Storm Tracker Chatbot Demo[/bold cyan]\n")
    
    # Test health check
    console.print("[yellow]1. Checking chatbot health...[/yellow]")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{base_url}/chatbot/health")
            health = response.json()
            
            if health["status"] == "healthy":
                console.print(f"[green]✅ Chatbot is healthy[/green]")
                console.print(f"   Qdrant connected: {health['qdrant_connected']}")
            else:
                console.print(f"[red]❌ Chatbot status: {health['status']}[/red]")
                console.print(f"   Message: {health['message']}")
                return
    except Exception as e:
        console.print(f"[red]❌ Failed to connect to chatbot: {e}[/red]")
        console.print("[yellow]Make sure the backend server is running![/yellow]")
        return
    
    # Test questions
    test_cases = [
        {
            "title": "Hỏi về chuẩn bị đón bão",
            "message": "Tôi cần chuẩn bị những gì khi có bão?",
            "storm_id": "STORM001"
        },
        {
            "title": "Hỏi về sơ cứu",
            "message": "Làm thế nào để sơ cứu người bị gãy xương?",
            "storm_id": "STORM001"
        },
        {
            "title": "Yêu cầu cứu hộ",
            "message": """Tôi cần cứu hộ khẩn cấp! 
            Tên: Nguyễn Văn A
            Số điện thoại: 0123456789
            Địa chỉ: 123 Đường Lê Lợi, Phường 1, Quận 1, TP.HCM
            Tình trạng: Nhà bị ngập sâu 1.5m, có 2 người già và 1 trẻ em
            Mức độ: Rất khẩn cấp""",
            "storm_id": "STORM001"
        },
        {
            "title": "Hỏi về phòng bệnh",
            "message": "Cần làm gì để phòng tránh dịch bệnh sau bão?",
            "storm_id": "STORM001"
        }
    ]
    
    conversation_history = []
    
    for idx, test_case in enumerate(test_cases, 1):
        console.print(f"\n[bold yellow]{idx}. {test_case['title']}[/bold yellow]")
        console.print(Panel(test_case['message'], title="User", border_style="blue"))
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{base_url}/chatbot/chat",
                    json={
                        "message": test_case['message'],
                        "storm_id": test_case['storm_id'],
                        "conversation_history": conversation_history
                    }
                )
                
                if response.status_code == 200:
                    result = response.json()
                    bot_response = result['response']
                    conversation_history = result['conversation_history']
                    
                    console.print(Panel(
                        Markdown(bot_response),
                        title="🤖 Chatbot",
                        border_style="green"
                    ))
                else:
                    console.print(f"[red]❌ Error: {response.status_code}[/red]")
                    console.print(response.text)
        
        except Exception as e:
            console.print(f"[red]❌ Error: {e}[/red]")
        
        # Wait between requests
        if idx < len(test_cases):
            await asyncio.sleep(2)
    
    console.print("\n[bold green]✅ Demo completed![/bold green]\n")


async def interactive_chat():
    """Interactive chat with the chatbot"""
    base_url = "http://localhost:8000"
    
    console.print("\n[bold cyan]🤖 Storm Tracker Chatbot - Interactive Mode[/bold cyan]")
    console.print("[yellow]Type 'quit' or 'exit' to end the conversation[/yellow]\n")
    
    # Get storm ID
    storm_id = console.input("[cyan]Enter Storm ID (e.g., STORM001): [/cyan]") or "STORM001"
    
    conversation_history = []
    
    while True:
        # Get user input
        message = console.input("\n[bold blue]You:[/bold blue] ")
        
        if message.lower() in ['quit', 'exit', 'q']:
            console.print("[yellow]Goodbye! 👋[/yellow]")
            break
        
        if not message.strip():
            continue
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{base_url}/chatbot/chat",
                    json={
                        "message": message,
                        "storm_id": storm_id,
                        "conversation_history": conversation_history
                    }
                )
                
                if response.status_code == 200:
                    result = response.json()
                    bot_response = result['response']
                    conversation_history = result['conversation_history']
                    
                    console.print(f"\n[bold green]🤖 Chatbot:[/bold green]")
                    console.print(Panel(Markdown(bot_response), border_style="green"))
                else:
                    console.print(f"[red]❌ Error: {response.status_code}[/red]")
                    console.print(response.text)
        
        except Exception as e:
            console.print(f"[red]❌ Error: {e}[/red]")


async def main():
    """Main entry point"""
    console.print("""
    [bold cyan]╔══════════════════════════════════════════╗
    ║   Storm Tracker Chatbot Demo Script   ║
    ╚══════════════════════════════════════════╝[/bold cyan]
    """)
    
    console.print("[yellow]Choose mode:[/yellow]")
    console.print("  1. Run automated demo")
    console.print("  2. Interactive chat")
    
    choice = console.input("\n[cyan]Enter choice (1 or 2): [/cyan]")
    
    if choice == "1":
        await test_chatbot()
    elif choice == "2":
        await interactive_chat()
    else:
        console.print("[red]Invalid choice![/red]")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        console.print("\n[yellow]Demo interrupted by user[/yellow]")
