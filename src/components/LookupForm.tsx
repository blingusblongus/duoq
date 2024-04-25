import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "./ui/button";
import { useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Input } from "./ui/input";
const options = [
    {
        value: "api/duos",
        label: "By Position",
    },
    {
        value: "api/duos/byChampion",
        label: "By Champion",
    },
    {
        value: "api/duos/byChampionByPosition",
        label: "By Champion and Position",
    },
];
export const LookupForm = () => {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState(options[0].value);
    return (
        <div className="min-w-md m-8 flex w-full max-w-md flex-col justify-center gap-3">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-[200px] justify-between"
                    >
                        {value
                            ? options.find(
                                  (framework) => framework.value === value,
                              )?.label
                            : "Select Query Type"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                    <RadioGroup defaultValue="option-one">
                        {options.map((framework) => {
                            const id = "radio-" + framework.value;
                            return (
                                <div
                                    key={id}
                                    className="flex items-center space-x-2"
                                    onClick={() => setValue(framework.value)}
                                >
                                    <RadioGroupItem
                                        value={framework.value}
                                        id={id}
                                    />
                                    <Label htmlFor={id}>
                                        {framework.label}
                                    </Label>
                                </div>
                            );
                        })}
                    </RadioGroup>
                </PopoverContent>
            </Popover>
            <form method="POST" action={value} className="flex flex-col gap-3">
                <Input name="summoner1" placeholder="summoner1" />
                <Input name="summoner2" placeholder="summoner2" />
                <Input name="summoner3" placeholder="summoner3" />
                <Input name="summoner4" placeholder="summoner4" />
                <Button>Look up stats</Button>
            </form>
        </div>
    );
};
